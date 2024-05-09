import AddCardModal from '@components/AddCardModal'
import Button from '@components/Button'
import Container from '@components/Container'
import EditCardModal from '@components/EditCardModal'
import HeaderBar from '@components/HeaderBar'
import Loading from '@components/Loading'
import { H2, Subheading } from '@components/Typography'
import { RootState } from '@dts/state'
import { CardType } from '@dts/stripe'
import useLoading from '@hooks/useLoading'
import useTheme from '@hooks/useTheme'
import { NavigationRoot } from '@scenes/root'
import Constants from '@shared/Constants'
import Stripe from '@shared/Stripe'
import I18n from 'i18n-js'
import React, { useCallback, useEffect, useState } from 'react'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { useSelector } from 'react-redux'
import useLayoutAnimation from '../../hooks/useLayoutAnimations'

const CardListScreen: React.FC = () => {
  const { color } = useTheme()
  const group = useSelector<RootState, RootState['group']>(state => state.group)
  const { showLoading, hideLoading } = useLoading()
  const [loading, setLoading] = useState(false)
  const [cardSelected, selectCard] = useState<CardType | undefined>()
  const [cards, setCards] = useState<CardType[]>([])
  const [isAddCard, setAddCard] = useState(false)
  const [isEditCard, setEditCard] = useState(false)
  const { custom } = useLayoutAnimation()

  const getCards = useCallback(async () => {
    setCards([])
    setLoading(true)
    const cardsResult = await Stripe.getCards(group.organisation?.id || '')
    setCards(cardsResult)
    setLoading(false)
  }, [group.organisation?.id])

  useEffect(() => {
    getCards()
  }, [getCards])

  const handleDeleteCard = useCallback(
    async cardId => {
      showLoading()
      const isSuccess = await Stripe.deleteCard(cardId, group.organisation?.id || '')
      if (isSuccess) {
        hideLoading()
        selectCard(undefined)
        getCards()
      } else {
        hideLoading()
      }
    },
    [hideLoading, showLoading, getCards, group.organisation?.id],
  )

  return (
    <Container safe>
      <HeaderBar
        title={`${I18n.t('text.Giving settings')} 💳`}
        iconLeft={'chevron-thin-left'}
        iconLeftFont={'entypo'}
        colorLeft={color.text}
        iconLeftSize={22}
        onPressLeft={() => {
          if (cardSelected) {
            custom()
            selectCard(undefined)
          } else {
            NavigationRoot.pop()
          }
        }}
      />

      <FlatList
        style={styles.flex}
        data={cards.filter(card => (cardSelected ? card.id === cardSelected.id : true))}
        ListHeaderComponent={loading ? <Loading style={styles.loading} /> : <View style={styles.header} />}
        ItemSeparatorComponent={() => <View style={styles.header} />}
        ListFooterComponent={
          loading ? null : (
            <View style={[styles.bottom, { borderColor: `${color.gray}50` }, cards.length === 0 ? styles.noneCard : styles.haveCard]}>
              {cardSelected ? (
                <View style={styles.flexStart}>
                  <Button.Full
                    onPress={() => setEditCard(true)}
                    text={`   ${I18n.t('text.Edit card info')}`}
                    icon="edit-2"
                    iconSize={18}
                    textStyle={styles.addText}
                  />
                  <Button.Full
                    onPress={() => {
                      const cardType = Stripe.mapCardBranch(cardSelected.card.brand)
                      NavigationRoot.navigate(Constants.SCENES.MODAL.BOTTOM_CONFIRM, {
                        titleIcon: <Text style={styles.titleIcon}>{'❌'}</Text>,
                        title: I18n.t('text.Are you sure you want to delete this card'),
                        description: I18n.t('text.This action will delete all saved information for card', {
                          brand: cardType.name,
                          last4: cardSelected.card.last4,
                        }),
                        confirmTitle: I18n.t('text.Delete card'),
                        cancelTitle: I18n.t('text.Cancel'),
                        confirmColor: color.red,
                        onConfirm: () => {
                          handleDeleteCard(cardSelected.id)
                        },
                      })
                    }}
                    text={`   ${I18n.t('text.Delete card')}`}
                    icon="x"
                    iconColor={color.red}
                    iconSize={18}
                    textStyle={[styles.addText, { color: color.red }]}
                  />
                </View>
              ) : (
                <Button.Full
                  onPress={() => setAddCard(true)}
                  text={`   ${I18n.t('text.Add a card')}`}
                  icon="plus-circle"
                  iconSize={18}
                  textStyle={styles.addText}
                  iconColor="text"
                />
              )}
              <View style={styles.flex} />
            </View>
          )
        }
        renderItem={({ item }) => {
          if (cardSelected !== undefined) {
            if (cardSelected.id !== item.id) {
              return null
            }
          }
          if (item.card) {
            const cardType = Stripe.mapCardBranch(item.card.brand)
            return (
              <TouchableOpacity
                onPress={() => {
                  custom()
                  selectCard(card => (card?.id === item.id ? undefined : item))
                }}
                style={styles.cardItem}>
                <View style={[styles.cardIcon, { borderColor: color.gray6 }]}>
                  <Image style={styles.icon} resizeMode="center" source={cardType.image} />
                </View>
                <View style={styles.flex}>
                  <H2 numberOfLines={1}>{cardType.name}</H2>
                  <Subheading numberOfLines={1}>{I18n.t('text.End in', { number: item.card.last4 })}</Subheading>
                </View>
              </TouchableOpacity>
            )
          }
          return null
        }}
      />

      {isAddCard && (
        <AddCardModal
          onClose={paymentMethod => {
            if (paymentMethod) {
              getCards()
            }
            setAddCard(false)
          }}
        />
      )}
      {isEditCard && (
        <EditCardModal
          onClose={requireReload => {
            setEditCard(false)
            if (requireReload) {
              selectCard(undefined)
              getCards()
            }
          }}
          cardSelected={cardSelected}
        />
      )}
    </Container>
  )
}

const styles = StyleSheet.create({
  loading: { height: 80, marginTop: 20, marginBottom: 20 },
  cardItem: { width: '100%', paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  icon: { height: 32, width: 50 },
  cardIcon: {
    width: 89,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 5,
    marginRight: 20,
  },
  flex: { flex: 1 },
  bottom: { width: '100%', flexDirection: 'row', paddingHorizontal: 12 },
  addText: { fontSize: 16, fontWeight: '600' },
  haveCard: {
    borderTopWidth: 1,
    marginTop: 20,
    paddingTop: 20,
  },
  noneCard: {
    borderTopWidth: 0,
    marginTop: 0,
    paddingTop: 0,
  },
  flexStart: { alignItems: 'flex-start' },
  header: { height: 20 },
  titleIcon: { fontSize: 35, marginTop: 30, marginBottom: -10 },
})

export default CardListScreen
